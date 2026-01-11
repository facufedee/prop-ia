import { PropiedadData } from "../../domain/entities/PropiedadData";
import { TasacionResult } from "../../domain/entities/TasacionResult";
import { ITasacionRepository } from "../../domain/repositories/ITasacionRepository";

export class CalcularTasacionUseCase {
  private repo: ITasacionRepository;

  constructor(repo: ITasacionRepository) {
    this.repo = repo;
  }

  async execute(data: PropiedadData): Promise<TasacionResult> {
    return this.repo.calcularTasacion(data);
  }
}
