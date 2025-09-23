import { Injectable } from "@angular/core";
import { RelationApi } from "../api/relation";
import { Observable } from "rxjs";



@Injectable({ providedIn: 'root' })
export class RelationRepository{

    constructor(private relationService: RelationApi){}

    getRelations(
        Id: string | string[],
        relationTypes: Array<string> | null = null,
        page?: number,
        pageSize?: number,
    ): Observable<Array<any>> {
        return this.relationService
            .getRelations(Id, relationTypes, page, pageSize)
            
    }
}