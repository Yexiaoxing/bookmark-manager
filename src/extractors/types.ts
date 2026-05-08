export type ExtractedArticle = {
  title: string | null;
  textContent: string;
  excerpt: string | null;
  byline: string | null;
};

export class DeletedContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeletedContentError";
  }
}
