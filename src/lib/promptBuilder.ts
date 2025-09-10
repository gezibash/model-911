export interface PromptTemplate {
  id: string;
  step: number;
  template: string;
  description?: string;
}

export interface PromptChain {
  name: string;
  description: string;
  templates: PromptTemplate[];
  systemPrompt?: string;
}

export const QUANTIZATION_CHAIN: PromptChain = {
  name: "quantization_detection",
  description: "Progressive sentence building for model fingerprinting",
  systemPrompt:
    'Complete this sentence with exactly ONE word. Respond ONLY with valid JSON: {"answer": "your_word"}',
  templates: [
    {
      id: "step_1",
      step: 1,
      template: "The meeting was extremely ____",
      description: "Initial adjective",
    },
    {
      id: "step_2",
      step: 2,
      template:
        "The meeting was extremely {ANSWER_1}. The manager felt increasingly ____",
      description: "Manager's emotional state",
    },
    {
      id: "step_3",
      step: 3,
      template:
        "The meeting was extremely {ANSWER_1}. The manager felt increasingly {ANSWER_2}, so she decided to be more ____",
      description: "Manager's behavioral change",
    },
    {
      id: "step_4",
      step: 4,
      template:
        "The meeting was extremely {ANSWER_1}. The manager felt increasingly {ANSWER_2}, so she decided to be more {ANSWER_3} and include exactly ____ team members.",
      description: "Team size (number)",
    },
    {
      id: "step_5",
      step: 5,
      template:
        "The meeting was extremely {ANSWER_1}. The manager felt increasingly {ANSWER_2}, so she decided to be more {ANSWER_3} and include exactly {ANSWER_4} team members. The project would launch in ____",
      description: "Launch timing",
    },
    {
      id: "step_6",
      step: 6,
      template:
        "The meeting was extremely {ANSWER_1}. The manager felt increasingly {ANSWER_2}, so she decided to be more {ANSWER_3} and include exactly {ANSWER_4} team members. The project would launch in {ANSWER_5} with a budget that was ____",
      description: "Budget description",
    },
    {
      id: "step_7",
      step: 7,
      template:
        "The meeting was extremely {ANSWER_1}. The manager felt increasingly {ANSWER_2}, so she decided to be more {ANSWER_3} and include exactly {ANSWER_4} team members. The project would launch in {ANSWER_5} with a budget that was {ANSWER_6}. Payments would arrive ____",
      description: "Payment schedule",
    },
    {
      id: "step_8",
      step: 8,
      template:
        "The meeting was extremely {ANSWER_1}. The manager felt increasingly {ANSWER_2}, so she decided to be more {ANSWER_3} and include exactly {ANSWER_4} team members. The project would launch in {ANSWER_5} with a budget that was {ANSWER_6}. Payments would arrive {ANSWER_7}, making the plan seem ____",
      description: "Plan assessment",
    },
    {
      id: "step_9",
      step: 9,
      template:
        "The meeting was extremely {ANSWER_1}. The manager felt increasingly {ANSWER_2}, so she decided to be more {ANSWER_3} and include exactly {ANSWER_4} team members. The project would launch in {ANSWER_5} with a budget that was {ANSWER_6}. Payments would arrive {ANSWER_7}, making the plan seem {ANSWER_8}. Everyone became remarkably ____",
      description: "Team reaction",
    },
    {
      id: "step_10",
      step: 10,
      template:
        "The meeting was extremely {ANSWER_1}. The manager felt increasingly {ANSWER_2}, so she decided to be more {ANSWER_3} and include exactly {ANSWER_4} team members. The project would launch in {ANSWER_5} with a budget that was {ANSWER_6}. Payments would arrive {ANSWER_7}, making the plan seem {ANSWER_8}. Everyone became remarkably {ANSWER_9}, and the outcome was ultimately ____",
      description: "Final outcome",
    },
  ],
};

export class SequentialPromptBuilder {
  constructor(private chain: PromptChain) {}

  buildPrompt(step: number, answers: Record<string, string>): string {
    const template = this.chain.templates.find((t) => t.step === step);
    if (!template) {
      throw new Error(`No template found for step ${step}`);
    }

    let prompt = template.template;

    // Replace all {ANSWER_N} placeholders with actual answers from previous steps
    for (let i = 1; i < step; i++) {
      const answerKey = `ANSWER_${i}`;
      const answer = answers[answerKey] || "ERROR";
      prompt = prompt.replace(`{${answerKey}}`, answer);
    }

    return prompt;
  }

  getSystemPrompt(): string | undefined {
    return this.chain.systemPrompt;
  }

  getTotalSteps(): number {
    return this.chain.templates.length;
  }

  getTemplate(step: number): PromptTemplate | undefined {
    return this.chain.templates.find((t) => t.step === step);
  }

  getChainInfo(): Pick<PromptChain, "name" | "description"> {
    return {
      name: this.chain.name,
      description: this.chain.description,
    };
  }
}

export function buildFinalSentence(answers: Record<string, string>): string {
  const finalTemplate = QUANTIZATION_CHAIN.templates[9].template; // Step 10 template
  let sentence = finalTemplate;

  // Replace all answer placeholders including the final ____
  for (let i = 1; i <= 9; i++) {
    sentence = sentence.replace(
      `{ANSWER_${i}}`,
      answers[`ANSWER_${i}`] || "ERROR",
    );
  }
  // Replace the final ____ with ANSWER_10
  sentence = sentence.replace("____", answers[`ANSWER_10`] || "ERROR");

  return sentence;
}
