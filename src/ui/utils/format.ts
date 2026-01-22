export const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === null || value === '') return '$0,00';

    const numberVal = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numberVal)) return '$0,00';

    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numberVal);
};
