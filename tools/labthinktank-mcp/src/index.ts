import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const server = new Server(
  { name: "labthinktank-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "run_recon",
      description:
        "Ejecuta el pipeline de reconocimiento (nmap, whatweb, dirsearch) contra un objetivo y guarda los resultados en reports/<target>/",
      inputSchema: {
        type: "object",
        properties: {
          target: { type: "string", description: "IP o dominio objetivo (ej: 192.168.1.1)" },
        },
        required: ["target"],
      },
    },
    {
      name: "list_reports",
      description: "Lista los reportes generados en reports/",
      inputSchema: {
        type: "object",
        properties: {
          target: {
            type: "string",
            description: "Filtrar por target específico (opcional)",
          },
        },
      },
    },
    {
      name: "read_report",
      description: "Lee un reporte de reconocimiento específico (nmap, dirsearch, whatweb)",
      inputSchema: {
        type: "object",
        properties: {
          target: { type: "string", description: "Target del reporte" },
          type: {
            type: "string",
            enum: ["nmap", "dirsearch", "whatweb"],
            description: "Tipo de reporte a leer",
          },
        },
        required: ["target", "type"],
      },
    },
    {
      name: "create_pentest_report",
      description:
        "Genera un reporte de pentesting profesional en Markdown usando el template de LabThinkTank",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título del engagement" },
          target: { type: "string", description: "Sistema(s) en scope" },
          client: { type: "string", description: "Nombre del cliente" },
          tester: { type: "string", description: "Nombre del tester o equipo" },
          start_date: { type: "string", description: "Fecha inicio (YYYY-MM-DD)" },
          end_date: { type: "string", description: "Fecha fin (YYYY-MM-DD)" },
        },
        required: ["title", "target", "client", "tester", "start_date", "end_date"],
      },
    },
    {
      name: "list_labs",
      description: "Lista los laboratorios y herramientas disponibles en el proyecto",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "docker_start",
      description: "Inicia el contenedor Kali Linux del laboratorio en modo detached",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "docker_stop",
      description: "Detiene y elimina el contenedor Kali Linux",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "run_recon": {
        const target = args?.target as string;
        const { stdout, stderr } = await execAsync(`bash recon.sh ${target}`, {
          cwd: REPO_ROOT,
          timeout: 180000,
        });
        return {
          content: [{ type: "text", text: stdout || stderr || "Recon completado sin salida." }],
        };
      }

      case "list_reports": {
        const target = args?.target as string | undefined;
        const reportsDir = path.join(REPO_ROOT, "reports");

        if (target) {
          const targetDir = path.join(reportsDir, target);
          const files = await fs.readdir(targetDir).catch(() => [] as string[]);
          const filtered = files.filter((f) => f !== ".gitkeep");
          return {
            content: [
              {
                type: "text",
                text: filtered.length
                  ? `Reportes para ${target}:\n${filtered.map((f) => `  - ${f}`).join("\n")}`
                  : `Sin reportes para ${target}`,
              },
            ],
          };
        }

        const entries = await fs.readdir(reportsDir).catch(() => [] as string[]);
        const targets = entries.filter((e) => e !== ".gitkeep");
        return {
          content: [
            {
              type: "text",
              text: targets.length
                ? `Targets con reportes:\n${targets.map((t) => `  - ${t}`).join("\n")}`
                : "Sin reportes generados aún. Ejecuta run_recon primero.",
            },
          ],
        };
      }

      case "read_report": {
        const target = args?.target as string;
        const type = args?.type as string;
        const filePath = path.join(REPO_ROOT, "reports", target, `${type}.txt`);
        const content = await fs
          .readFile(filePath, "utf-8")
          .catch(() => `Reporte no encontrado: reports/${target}/${type}.txt`);
        return { content: [{ type: "text", text: content }] };
      }

      case "create_pentest_report": {
        const { title, target, client, tester, start_date, end_date } = args as Record<
          string,
          string
        >;
        const template = await fs.readFile(
          path.join(REPO_ROOT, "templates/pentest-report.md"),
          "utf-8"
        );

        const year = new Date().getFullYear().toString();
        const report = template
          .replace(/\[TÍTULO DEL ENGAGEMENT\]/g, title)
          .replace(/\[Nombre del cliente\]/g, client)
          .replace(/\[Nombre del tester\]/g, tester)
          .replace(/\[Fecha inicio\]/g, start_date)
          .replace(/\[Fecha fin\]/g, end_date)
          .replace(/\[FECHA INICIO\]/g, start_date)
          .replace(/\[FECHA FIN\]/g, end_date)
          .replace(/\[SISTEMAS EN SCOPE\]/g, target)
          .replace(/\[CLIENTE\]/g, client)
          .replace(/\[AÑO\]/g, year);

        const outDir = path.join(REPO_ROOT, "reports", target.replace(/[^a-zA-Z0-9._-]/g, "_"));
        await fs.mkdir(outDir, { recursive: true });
        const outFile = `pentest-report-${start_date}.md`;
        const outPath = path.join(outDir, outFile);
        await fs.writeFile(outPath, report);

        return {
          content: [
            {
              type: "text",
              text: `Reporte creado en: reports/${target}/${outFile}\n\nPróximos pasos:\n1. Ejecuta run_recon para recolectar evidencia\n2. Completa los hallazgos en el reporte\n3. Agrega el análisis con read_report`,
            },
          ],
        };
      }

      case "list_labs": {
        const labsDir = path.join(REPO_ROOT, "labs");
        const toolsDir = path.join(REPO_ROOT, "tools");

        const [labs, tools] = await Promise.all([
          fs.readdir(labsDir, { withFileTypes: true }).catch(() => []),
          fs.readdir(toolsDir, { withFileTypes: true }).catch(() => []),
        ]);

        const labList = labs.filter((e) => e.isDirectory()).map((e) => e.name);
        const toolList = tools
          .filter((e) => e.isDirectory() && e.name !== "labthinktank-mcp")
          .map((e) => e.name);

        return {
          content: [
            {
              type: "text",
              text: [
                `Labs (${labList.length}): ${labList.join(", ") || "vacío"}`,
                `Tools (${toolList.length}): ${toolList.join(", ") || "vacío"}`,
              ].join("\n"),
            },
          ],
        };
      }

      case "docker_start": {
        const { stdout, stderr } = await execAsync("docker compose up -d --build", {
          cwd: path.join(REPO_ROOT, "containers"),
          timeout: 120000,
        });
        return {
          content: [{ type: "text", text: stdout || stderr || "Kali lab iniciado." }],
        };
      }

      case "docker_stop": {
        const { stdout } = await execAsync("docker compose down", {
          cwd: path.join(REPO_ROOT, "containers"),
          timeout: 60000,
        });
        return {
          content: [{ type: "text", text: stdout || "Kali lab detenido." }],
        };
      }

      default:
        throw new Error(`Herramienta desconocida: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
