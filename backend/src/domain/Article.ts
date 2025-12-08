export interface Article {
  id: number;
  title: string;
  content: string;
  created_at: Date;
}

export interface CreateArticleDTO {
  title: string;
  content: string;
}

export interface UpdateArticleDTO {
  title: string;
  content: string;
}
