import { Alquiler } from "@/domain/models/Alquiler";
import { Document } from "docx";

export interface DocumentGenerator {
    generate(data: Alquiler): Document;
}

export abstract class DocumentFactory {
    abstract createGenerator(type: string): DocumentGenerator;
}
