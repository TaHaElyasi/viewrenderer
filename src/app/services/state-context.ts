import { Injectable } from "@angular/core";
import { ContextTreeService } from "@hasan-akbari/context-tree";

export interface state {
    editMode: boolean;
    isReadOnly: boolean;
}


@Injectable()
export class StateContext extends ContextTreeService<state>{

}