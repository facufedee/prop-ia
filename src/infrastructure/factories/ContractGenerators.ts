import { DocumentFactory, DocumentGenerator } from "@/domain/factories/DocumentFactory";
import { Alquiler } from "@/domain/models/Alquiler";
import { contractDocxService } from "../services/contractDocxService";
import { Document } from "docx";

class RentalContractGenerator implements DocumentGenerator {
    generate(data: Alquiler): Document {
        return contractDocxService.createContractDocument(data);
    }
}

class SaleContractGenerator implements DocumentGenerator {
    generate(data: Alquiler): Document {
        // Placeholder for sale contract logic
        // In a real app, this would use a different logic/service
        console.warn("Sale contracts not yet implemented, returning default");
        return contractDocxService.createContractDocument(data);
    }
}

export class ConcreteDocumentFactory extends DocumentFactory {
    createGenerator(type: string): DocumentGenerator {
        switch (type.toLowerCase()) {
            case 'rental':
            case 'alquiler':
                return new RentalContractGenerator();
            case 'sale':
            case 'venta':
                return new SaleContractGenerator();
            default:
                throw new Error(`Invalid document type: ${type}`);
        }
    }
}
