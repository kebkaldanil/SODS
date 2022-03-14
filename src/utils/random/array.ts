import random from ".";
import { notNullOrDefault } from "../object";
import { split } from "../split";

export type AccesibleType = "number" | "int" | `string:${string}-${string}` | `number:${number}-${number}` | `int:${number}-${number}`;
export const array = {
    of(type: AccesibleType, length: number) {
        const result = [];
        const [gtype, srange] = split(type, ":", 2);
        const srangeDeli = srange.indexOf("-", 1);
        let from: string | number;
        let to: string | number;
        if (srangeDeli !== -1) {
            from = srange.slice(0, srangeDeli);
            to = srange.slice(srangeDeli + 1);
        }
        switch (gtype) {
            case "number":
                from = +notNullOrDefault(from, 0);
                to = +notNullOrDefault(to, 1);
                while(length--) {
                    result[length] = random.number.inRange(from, to);
                }
                break;
            case "int":
                from = +notNullOrDefault(from, 0);
                to = +notNullOrDefault(to, 1);
                while(length--) {
                    result[length] = random.number.inRange(from, to);
                }
        }
    }
};
