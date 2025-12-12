import system_design from "./system-design.json";
import algorithms from "./algorithms.json";
import frontend from "./frontend.json";
import database from "./database.json";
import devops from "./devops.json";
import sre from "./sre.json";

export const questionsByChannel: Record<string, any[]> = {
  "system-design": system_design,
  "algorithms": algorithms,
  "frontend": frontend,
  "database": database,
  "devops": devops,
  "sre": sre
};

export const allQuestions = Object.values(questionsByChannel).flat();
