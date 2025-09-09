import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";


@Injectable()
export class RelationApi{

    constructor(private readonly httpClient: HttpClient){}
    
    getRelations(
        Id: string | string[],
        relationTypes: Array<string> | null,
        page: number = 0,
        pageSize: number = 0
    ): Observable<any> {
        const _relationTypes = relationTypes !== null ? relationTypes.join('","') : '';
        const _id = Array.isArray(Id) ? Id.join('","') : Id;
        let limit = 0;
        let body = {
            id: _id,
            relationTypes: relationTypes,
            page: page,
            pageSize: pageSize
        };
        return this.httpClient.post<any>(`https://test.test/test`, body);
    }
}