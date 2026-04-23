import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
    getHealth() {
        return "*** Sideproject BE Running ***";
    }
}
