export interface dbAdapter {
  table: string;
  getByKey(key: number | string, pk?: string): Promise<any>;
  getWhere(condition: string, limit?: number, skip?: number): Promise<any[]>;
  insert(obj: any): Promise<void>;
  insert(obj: any[]): Promise<void>;
  updateWhere(obj: any, where: string, editedProps: string[]): Promise<void>;
  update(obj: any, key: string | number, editedProps: string[], pk?: string): Promise<void>;
  deleteWhere(where: string): Promise<void>;
  delete(key: string | number, pk?: string): Promise<void>;

  run?(sql: string): Promise<any>;
}