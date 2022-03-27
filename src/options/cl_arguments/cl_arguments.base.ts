import { Argument } from "./cl_arguments.decorators";

export class CommandLineArgumentsBase {
  @Argument("-p")
    port: number;

  @Argument()
    default: string;
}
