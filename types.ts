
export interface GenerationState {
  originalImage: string | null;
  characterName: string;
  isGenerating: boolean;
  resultImage: string | null;
  error: string | null;
  status: string;
}

export interface PromptData {
  clothing: string;
  pose: string;
  expression: string;
  characterDetails: {
    name: string;
    type: string;
    interaction: string;
  };
  environment: string;
}
