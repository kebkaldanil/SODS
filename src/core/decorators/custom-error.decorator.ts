export function CustomError(name?: string): ClassDecorator {
  return (target) => void (target.prototype.name = name ?? target.name);
}
