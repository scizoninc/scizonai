// backend/index.js
const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const FormData = require("form-data");

require("dotenv").config();

const HF_SPACE_URL = process.env.HF_SPACE_URL; // ex: https://hf.space/run/<user>/<space>/api/predict (ajuste)
const HF_TOKEN = process.env.HF_TOKEN; // opcional
if (!HF_SPACE_URL) {
  console.warn("HF_SPACE_URL não configurado. Configure em .env");
}

const upload = multer({ dest: path.join(__dirname, "uploads/") });
const app = express();
app.use(express.json());

const JOBS_DIR = path.join(__dirname, "jobs");
if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });

// jobs in-memory map (id -> meta)
const jobs = new Map(); // { status, progress, message, outputPath, createdAt }

function createJob() {
  const id = uuidv4();
  const folder = path.join(JOBS_DIR, id);
  fs.mkdirSync(folder, { recursive: true });
  const meta = { status: "pending", progress: 0, message: "Job criado", outputPath: null, createdAt: Date.now() };
  jobs.set(id, meta);
  return { id, folder, meta };
}

app.post("/api/upload", upload.array("files", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Cria job
    const { id: jobId, folder, meta } = createJob();
    meta.status = "processing";
    meta.progress = 5;
    meta.message = "Enviando para Hugging Face Space...";

    // Move arquivos para pasta do job
    req.files.forEach((f) => {
      const dest = path.join(folder, f.originalname);
      fs.renameSync(f.path, dest);
    });

    // Inicia processamento assíncrono
    process.nextTick(() => runJob(jobId, folder));

    return res.json({ jobId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar job" });
  }
});

app.get("/api/status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job não encontrado" });
  return res.json({ status: job.status, progress: job.progress, message: job.message });
});

app.post("/api/checkout/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job não encontrado" });
  // Aqui você integraria com Stripe/PayPal. Vamos apenas marcar como paid.
  job.paid = true;
  return res.json({ success: true });
});

app.get("/api/download/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job não encontrado" });
  if (!job.outputPath) return res.status(400).json({ error: "Arquivo ainda não pronto" });
  const filePath = job.outputPath;
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Arquivo não encontrado" });
  res.download(filePath, `report-${req.params.jobId}.pdf`);
});

async function runJob(jobId, folder) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    // List files
    const files = fs.readdirSync(folder).map((f) => path.join(folder, f));

    // Atualiza meta
    job.status = "processing";
    job.progress = 10;
    job.message = "Preparando payload";

    // Monta form-data para enviar ao Space
    const form = new FormData();
    files.forEach((filePath) => {
      form.append("files", fs.createReadStream(filePath));
    });

    // (Opcional) inclui prompt especifico
    const prompt = `Gere um relatório PDF organizado com gráficos, sumário executivo e análise a partir dos dados anexados.`;
    form.append("prompt", prompt);

    // envia para HF Space
    job.message = "Enviando ao Hugging Face Space...";
    job.progress = 25;

    const headers = {};
    if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

    // Note: adaptar URL conforme o seu Space. Muitos Spaces expõem /api/predict ou endpoints customizados.
    const response = await fetch(HF_SPACE_URL, {
      method: "POST",
      headers,
      body: form,
      // timeout handled below
    });

    // Se o Space enviar um PDF binário direto:
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/pdf")) {
      job.message = "Recebendo PDF do Space...";
      job.progress = 70;
      const arrayBuffer = await response.arrayBuffer();
      const outPath = path.join(folder, "output.pdf");
      fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
      job.outputPath = outPath;
      job.progress = 100;
      job.status = "completed";
      job.message = "Concluído";
      return;
    }

    // Se o Space retornar JSON com result_url:
    const respJson = await response.json().catch(() => null);
    if (respJson && respJson.result_url) {
      job.message = "Space retornou URL de resultado. Fazendo download...";
      job.progress = 60;
      const downloadRes = await fetch(respJson.result_url);
      const buf = await downloadRes.arrayBuffer();
      const outPath = path.join(folder, "output.pdf");
      fs.writeFileSync(outPath, Buffer.from(buf));
      job.outputPath = outPath;
      job.progress = 100;
      job.status = "completed";
      job.message = "Concluído";
      return;
    }

    // Se o Space retorna um objeto com job_id para polling (suporte opcional)
    if (respJson && respJson.job_id) {
      job.message = "Space retornou job_id. Polling...";
      job.progress = 30;
      // Exemplo de polling: (ajuste endpoint)
      const remoteJobId = respJson.job_id;
      const pollUrl = `${HF_SPACE_URL.replace(/\/run.*$/, "")}/status/${remoteJobId}`; // ajustar
      let attempts = 0;
      while (attempts < 60) {
        attempts += 1;
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const sres = await fetch(pollUrl, { headers });
          const sjson = await sres.json().catch(() => null);
          if (sjson?.status === "completed" && sjson?.result_url) {
            const d = await fetch(sjson.result_url);
            const buf = await d.arrayBuffer();
            const outPath = path.join(folder, "output.pdf");
            fs.writeFileSync(outPath, Buffer.from(buf));
            job.outputPath = outPath;
            job.progress = 100;
            job.status = "completed";
            job.message = "Concluído";
            return;
          } else {
            job.progress = Math.min(95, job.progress + 5);
            job.message = sjson?.message ?? "Processando remotamente...";
          }
        } catch (e) {
          console.warn("Polling error", e);
        }
      }
    }

    // fallback: se chegamos aqui, não recebemos PDF
    job.status = "error";
    job.message = "Resposta inesperada do Space";
    job.progress = 0;
  } catch (err) {
    console.error("Erro no job", jobId, err);
    job.status = "error";
    job.message = (err && err.message) || "Erro no processamento";
    job.progress = 0;
  }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
// backend/index.js
const express = require("express");
const multer = require("multer");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const FormData = require("form-data");

require("dotenv").config();

const HF_SPACE_URL = process.env.HF_SPACE_URL; // ex: https://hf.space/run/<user>/<space>/api/predict (ajuste)
const HF_TOKEN = process.env.HF_TOKEN; // opcional
if (!HF_SPACE_URL) {
  console.warn("HF_SPACE_URL não configurado. Configure em .env");
}

const upload = multer({ dest: path.join(__dirname, "uploads/") });
const app = express();
app.use(express.json());

const JOBS_DIR = path.join(__dirname, "jobs");
if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });

// jobs in-memory map (id -> meta)
const jobs = new Map(); // { status, progress, message, outputPath, createdAt }

function createJob() {
  const id = uuidv4();
  const folder = path.join(JOBS_DIR, id);
  fs.mkdirSync(folder, { recursive: true });
  const meta = { status: "pending", progress: 0, message: "Job criado", outputPath: null, createdAt: Date.now() };
  jobs.set(id, meta);
  return { id, folder, meta };
}

app.post("/api/upload", upload.array("files", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Cria job
    const { id: jobId, folder, meta } = createJob();
    meta.status = "processing";
    meta.progress = 5;
    meta.message = "Enviando para Hugging Face Space...";

    // Move arquivos para pasta do job
    req.files.forEach((f) => {
      const dest = path.join(folder, f.originalname);
      fs.renameSync(f.path, dest);
    });

    // Inicia processamento assíncrono
    process.nextTick(() => runJob(jobId, folder));

    return res.json({ jobId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar job" });
  }
});

app.get("/api/status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job não encontrado" });
  return res.json({ status: job.status, progress: job.progress, message: job.message });
});

app.post("/api/checkout/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job não encontrado" });
  // Aqui você integraria com Stripe/PayPal. Vamos apenas marcar como paid.
  job.paid = true;
  return res.json({ success: true });
});

app.get("/api/download/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job não encontrado" });
  if (!job.outputPath) return res.status(400).json({ error: "Arquivo ainda não pronto" });
  const filePath = job.outputPath;
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Arquivo não encontrado" });
  res.download(filePath, `report-${req.params.jobId}.pdf`);
});

async function runJob(jobId, folder) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    // List files
    const files = fs.readdirSync(folder).map((f) => path.join(folder, f));

    // Atualiza meta
    job.status = "processing";
    job.progress = 10;
    job.message = "Preparando payload";

    // Monta form-data para enviar ao Space
    const form = new FormData();
    files.forEach((filePath) => {
      form.append("files", fs.createReadStream(filePath));
    });

    // (Opcional) inclui prompt especifico
    const prompt = `Gere um relatório PDF organizado com gráficos, sumário executivo e análise a partir dos dados anexados.`;
    form.append("prompt", prompt);

    // envia para HF Space
    job.message = "Enviando ao Hugging Face Space...";
    job.progress = 25;

    const headers = {};
    if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

    // Note: adaptar URL conforme o seu Space. Muitos Spaces expõem /api/predict ou endpoints customizados.
    const response = await fetch(HF_SPACE_URL, {
      method: "POST",
      headers,
      body: form,
      // timeout handled below
    });

    // Se o Space enviar um PDF binário direto:
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/pdf")) {
      job.message = "Recebendo PDF do Space...";
      job.progress = 70;
      const arrayBuffer = await response.arrayBuffer();
      const outPath = path.join(folder, "output.pdf");
      fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
      job.outputPath = outPath;
      job.progress = 100;
      job.status = "completed";
      job.message = "Concluído";
      return;
    }

    // Se o Space retornar JSON com result_url:
    const respJson = await response.json().catch(() => null);
    if (respJson && respJson.result_url) {
      job.message = "Space retornou URL de resultado. Fazendo download...";
      job.progress = 60;
      const downloadRes = await fetch(respJson.result_url);
      const buf = await downloadRes.arrayBuffer();
      const outPath = path.join(folder, "output.pdf");
      fs.writeFileSync(outPath, Buffer.from(buf));
      job.outputPath = outPath;
      job.progress = 100;
      job.status = "completed";
      job.message = "Concluído";
      return;
    }

    // Se o Space retorna um objeto com job_id para polling (suporte opcional)
    if (respJson && respJson.job_id) {
      job.message = "Space retornou job_id. Polling...";
      job.progress = 30;
      // Exemplo de polling: (ajuste endpoint)
      const remoteJobId = respJson.job_id;
      const pollUrl = `${HF_SPACE_URL.replace(/\/run.*$/, "")}/status/${remoteJobId}`; // ajustar
      let attempts = 0;
      while (attempts < 60) {
        attempts += 1;
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const sres = await fetch(pollUrl, { headers });
          const sjson = await sres.json().catch(() => null);
          if (sjson?.status === "completed" && sjson?.result_url) {
            const d = await fetch(sjson.result_url);
            const buf = await d.arrayBuffer();
            const outPath = path.join(folder, "output.pdf");
            fs.writeFileSync(outPath, Buffer.from(buf));
            job.outputPath = outPath;
            job.progress = 100;
            job.status = "completed";
            job.message = "Concluído";
            return;
          } else {
            job.progress = Math.min(95, job.progress + 5);
            job.message = sjson?.message ?? "Processando remotamente...";
          }
        } catch (e) {
          console.warn("Polling error", e);
        }
      }
    }

    // fallback: se chegamos aqui, não recebemos PDF
    job.status = "error";
    job.message = "Resposta inesperada do Space";
    job.progress = 0;
  } catch (err) {
    console.error("Erro no job", jobId, err);
    job.status = "error";
    job.message = (err && err.message) || "Erro no processamento";
    job.progress = 0;
  }
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
