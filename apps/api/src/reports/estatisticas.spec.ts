import { calcularEstatisticas, media } from './estatisticas.js';

describe('calcularEstatisticas', () => {
  it('calcula média, mediana e desvio padrão populacional', () => {
    expect(calcularEstatisticas([2, 4, 4, 4, 5, 5, 7, 9])).toEqual({
      quantidade: 8,
      media: 5,
      mediana: 4.5,
      desvioPadrao: 2,
      maior: 9,
      menor: 2,
    });
  });

  it('usa o valor do meio quando a quantidade é ímpar', () => {
    expect(calcularEstatisticas([8.5, 6, 7.5])?.mediana).toBe(7.5);
  });

  it('não depende da ordem das notas', () => {
    expect(calcularEstatisticas([9, 2, 5, 4, 7, 4, 5, 4])).toEqual(calcularEstatisticas([2, 4, 4, 4, 5, 5, 7, 9]));
  });

  it('devolve null sem notas (a tela mostra "—")', () => {
    expect(calcularEstatisticas([])).toBeNull();
    expect(media([])).toBeNull();
  });

  it('arredonda para 2 casas', () => {
    expect(media([7, 8, 8])).toBe(7.67);
  });
});
