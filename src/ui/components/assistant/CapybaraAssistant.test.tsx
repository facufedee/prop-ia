import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CapybaraAssistant, { setAssistantTipsHidden } from './CapybaraAssistant';

describe('CapybaraAssistant', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('shows the message in a speech bubble', () => {
        render(<CapybaraAssistant messageKey="a" message="Elegí la propiedad" />);
        expect(screen.getByRole('status')).toHaveTextContent('Elegí la propiedad');
    });

    it('hides the tips and shows them again from the shared setting', () => {
        render(<CapybaraAssistant messageKey="a" message="Elegí la propiedad" />);

        fireEvent.click(screen.getByLabelText('Ocultar ayuda'));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(window.localStorage.getItem('zp-assistant-collapsed')).toBe('1');

        act(() => setAssistantTipsHidden(false));
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('starts collapsed when the viewer hid it before', () => {
        window.localStorage.setItem('zp-assistant-collapsed', '1');
        render(<CapybaraAssistant messageKey="a" message="Elegí la propiedad" />);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows important alerts even when minimized, and closing one hides only that alert', () => {
        window.localStorage.setItem('zp-assistant-collapsed', '1');
        const { rerender } = render(<CapybaraAssistant important messageKey="overdue-1" message="Tenés un cobro vencido" />);
        expect(screen.getByRole('status')).toHaveTextContent('Tenés un cobro vencido');

        fireEvent.click(screen.getByLabelText('Ocultar ayuda'));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();

        rerender(<CapybaraAssistant important messageKey="overdue-2" message="Tenés dos cobros vencidos" />);
        expect(screen.getByRole('status')).toHaveTextContent('Tenés dos cobros vencidos');
    });
});
