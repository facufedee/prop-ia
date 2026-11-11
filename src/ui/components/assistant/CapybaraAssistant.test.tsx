import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CapybaraAssistant from './CapybaraAssistant';

describe('CapybaraAssistant', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('shows the message in a speech bubble', () => {
        render(<CapybaraAssistant messageKey="a" message="Elegí la propiedad" />);
        expect(screen.getByRole('status')).toHaveTextContent('Elegí la propiedad');
    });

    it('hides the bubble and brings it back when tapping the capybara', () => {
        render(<CapybaraAssistant messageKey="a" message="Elegí la propiedad" />);

        fireEvent.click(screen.getByLabelText('Ocultar ayuda'));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(window.localStorage.getItem('zp-assistant-collapsed')).toBe('1');

        fireEvent.click(screen.getByLabelText('Mostrar ayuda de Capi'));
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('starts collapsed when the viewer hid it before', () => {
        window.localStorage.setItem('zp-assistant-collapsed', '1');
        render(<CapybaraAssistant messageKey="a" message="Elegí la propiedad" />);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
});
