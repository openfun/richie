import { Resource } from 'types/Resource';
import { Nullable } from 'utils/types';

/** Details about the way a placeholder & plugin link a category with a course. */
interface CategoryPlaceholderInfo {
  slot: string;
  position: number;
}

/** Additional data on a category as it relates to a course. */
interface CategoryData {
  color: Nullable<string>;
  icon: Nullable<{
    sizes: string;
    src: string;
    srcset: string;
  }>;
  name: string;
  meta_name: string;
  meta_title: string;
  parent_name: Nullable<string>;
  parent_title: Nullable<string>;
  placeholders: CategoryPlaceholderInfo[];
  title: string;
}

export interface Course extends Resource {
  absolute_url: string;
  categories: string[];
  categories_data: CategoryData[];
  cover_image: Nullable<{
    sizes: string;
    src: string;
    srcset: string;
  }>;
  organization_highlighted: string;
  organizations: string[];
  state: {
    call_to_action: Nullable<string>;
    datetime: Nullable<string>;
    priority: number;
    text: string;
  };
}
