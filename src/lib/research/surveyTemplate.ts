import { ComparisonItem, SurveyItem } from "@/types/research";

export interface SurveyQuestionDef {
  id: string;
  questionId: string;
  label: string;
  questionText: string;
}

export const COMPARISON_QUESTIONS: SurveyQuestionDef[] = [
  {
    id: "comp-1a",
    questionId: "Q1a",
    label: "Brand Identity",
    questionText: "What are the key characteristics of your brand? (e.g., innovative, sustainable, luxurious, fun, minimalist, sporty, lively)",
  },
  {
    id: "comp-1b",
    questionId: "Q1b",
    label: "Brand Vision",
    questionText: "What future do you hope to create with this brand?",
  },
  {
    id: "comp-1c",
    questionId: "Q1c",
    label: "Core Values",
    questionText: "What values will guide your brand? (e.g., eco-friendliness, customer-centricity, quality)",
  },
  {
    id: "comp-2",
    questionId: "Q1.1",
    label: "Brand Concept Confidence",
    questionText: "How confident are you in your current brand concept and the direction you're heading? (Scale 1-10)",
  },
  {
    id: "comp-3",
    questionId: "Q2",
    label: "Target Customer Identification",
    questionText: "Who are your target customers? Define your audience as specifically as possible. (Demographics, Psychographics)",
  },
  {
    id: "comp-4",
    questionId: "Q2.1",
    label: "Target Customer Confidence",
    questionText: "How confident are you that you've correctly identified your target customer? (Scale 1-10)",
  },
  {
    id: "comp-5",
    questionId: "Q2.2",
    label: "Niche",
    questionText: "Do you see a niche within your target market that you can serve?",
  },
  {
    id: "comp-6",
    questionId: "Q3",
    label: "Platforms for Branding",
    questionText: "What are the main platforms you plan to use for branding? Choose from content-based platforms (e.g., Instagram, TikTok) or commerce-based platforms (e.g., Etsy, Amazon, eBay).",
  },
  {
    id: "comp-7",
    questionId: "Q3.3",
    label: "Content Strategy",
    questionText: "If you're planning to use content-based platforms (like Instagram or TikTok), what type of content do you want to create to drive traffic?",
  },
  {
    id: "comp-8",
    questionId: "Q4",
    label: "Product Offerings",
    questionText: "What are your product offerings? Be specific if you already have a clear idea.",
  },
  {
    id: "comp-9",
    questionId: "Q4.1",
    label: "Product Offerings Confidence",
    questionText: "How confident are you in the product offerings you've selected for your brand? (Scale 1-10)",
  },
  {
    id: "comp-10",
    questionId: "Q4.2",
    label: "Product Category Decision Influences",
    questionText: "Why did you choose this product category? On a scale of 0-4, choose the influence on your decision. (0: no influence, 1: a little, 2: some, 3: major, 4: decisive)",
  },
  {
    id: "comp-11",
    questionId: "Pre-Survey 2 / Post-Survey 2",
    label: "Personal Brand Confidence",
    questionText: "On a scale of 1-10 (pre) / 1-5 (post), how confident are you about creating a small personal brand on social media at the moment?",
  },
  {
    id: "comp-12",
    questionId: "Pre-Survey 4 / Post-Survey 3",
    label: "Independent Brand Creation Confidence",
    questionText: "On a scale of 1-10 (pre) / 1-5 (post), how confident are you about creating this brand all by yourself at the moment?",
  },
];

export const PRE_SURVEY_ADDITIONAL_QUESTIONS: SurveyQuestionDef[] = [
  {
    id: "pre-1",
    questionId: "Pre-Survey 1",
    label: "Prior Marketing Experience",
    questionText: "What is your prior experience in branding and marketing? (such as courses taken, your internship, or other types exposure to the industry)",
  },
  {
    id: "pre-3",
    questionId: "Pre-Survey 3",
    label: "Sense of Control",
    questionText: "On a scale of 1-10, how much do you think you have a sense of CONTROL to complete this project?",
  },
];

export const POST_SURVEY_ADDITIONAL_QUESTIONS: SurveyQuestionDef[] = [
  {
    id: "post-1",
    questionId: "Post-Survey 1",
    label: "Overall AI Prompting Skills",
    questionText: "How would you rate your overall AI prompting skills? (Scale 1-10)",
  },
  {
    id: "post-2",
    questionId: "Post-Survey 1.1",
    label: "AI Usage Frequency",
    questionText: "How often do you use LLM-based AI models (ChatGPT, Claude, DeepSeek etc.) in your daily life?",
  },
  {
    id: "post-3",
    questionId: "Post-Survey 1.2",
    label: "Prior Training in AI Prompting",
    questionText: "Have you had any prior training in AI prompting? If yes, explain in what nature (youtube videos, in other classes, other workshops).",
  },
  {
    id: "post-4",
    questionId: "Q5.1",
    label: "AI Suggestions Overall Impact",
    questionText: "To what extent do you feel that AI suggestions improved your overall brand concept (brand identity, target audience, product offerings, and platform strategy)? (Scale 1-10)",
  },
  {
    id: "post-5",
    questionId: "Q5.2",
    label: "Most Helpful Aspects of AI",
    questionText: "What aspects of using AI did you find most helpful in refining your brand concept?",
  },
  {
    id: "post-6",
    questionId: "Q5.3",
    label: "Challenges When Using AI",
    questionText: "What challenges, if any, did you encounter when using AI to refine your brand ideas?",
  },
  {
    id: "post-7",
    questionId: "Q5.4",
    label: "Helpfulness of Example Prompts",
    questionText: "To what extent do you find my guiding/example prompts helpful? (Scale 1-10)",
  },
];
