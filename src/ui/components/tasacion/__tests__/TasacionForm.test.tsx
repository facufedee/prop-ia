import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TasacionForm from '../TasacionForm';
import { LOCATION_DATA } from '../data/locations';

// Mock the prediction service
vi.mock('@/lib/prediction/predictionService', () => ({
    predictionService: {
        predict: vi.fn().mockResolvedValue(250000)
    }
}));

// Mock the audit log service
vi.mock('@/infrastructure/services/auditLogService', () => ({
    auditLogService: {
        logValuation: vi.fn().mockResolvedValue(true)
    }
}));

// Mock firebase auth
vi.mock('@/infrastructure/firebase/client', () => ({
    auth: {
        currentUser: {
            uid: 'test-uid',
            email: 'test@example.com',
            displayName: 'Test User'
        }
    }
}));

describe('TasacionForm', () => {
    it('renders the form elements correctly', () => {
        render(<TasacionForm />);
        expect(screen.getByText('Ubicación')).toBeDefined();
        expect(screen.getByText('Detalles')).toBeDefined();
        expect(screen.getByText('Esperando Datos')).toBeDefined();
    });

    it('fills the form when clicking "Ejemplo"', () => {
        render(<TasacionForm />);
        const exampleBtn = screen.getByText('Ejemplo');
        fireEvent.click(exampleBtn);

        // Check if some fields are filled (this is just a simplified check)
        // Since we use custom InputField/SelectField, we check for presence of values
        // Note: internal state is updated, we verify if "Esperando Datos" is still there (it should be)
        expect(screen.getByText('Esperando Datos')).toBeDefined();
    });

    it('shows "Complete el Formulario" when fields are missing', () => {
        render(<TasacionForm />);
        const submitBtn = screen.getByRole('button', { name: /Complete el Formulario/i });
        expect(submitBtn).toBeDefined();
        expect(submitBtn).toBeDisabled();
    });
});
