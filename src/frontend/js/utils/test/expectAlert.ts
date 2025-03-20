import { waitFor } from '@testing-library/react';
import { VariantType } from '@openfun/cunningham-react';

export const expectAlertError = (message: string, rootElement: ParentNode = document) => {
  return expectAlert(VariantType.ERROR, message, rootElement);
};

export const expectAlertInfo = (message: string, rootElement: ParentNode = document) => {
  return expectAlert(VariantType.INFO, message, rootElement);
};

export const expectAlertSuccess = (message: string, rootElement: ParentNode = document) => {
  return expectAlert(VariantType.SUCCESS, message, rootElement);
};

export const expectAlertWarning = (message: string, rootElement: ParentNode = document) => {
  return expectAlert(VariantType.WARNING, message, rootElement);
};

export const expectAlert = (
  type: VariantType,
  message: string,
  rootElement: ParentNode = document,
) => {
  return waitFor(async () => {
    // Cunningham Alert has a class with the alert variant type
    const alert = rootElement.querySelector(`.c__alert--${type}`) as HTMLElement;
    expect(alert).not.toBeNull();
    expect(alert).toHaveTextContent(message);
  });
};

export const expectNoAlert = (
  type: VariantType,
  message: string,
  rootElement: ParentNode = document,
) => {
  return waitFor(() => {
    // Check that no alert exists with this message and type
    const alerts = rootElement.querySelectorAll('.c__alert');
    const matchingAlert = Array.from(alerts).find(
      (alert) =>
        alert.classList.contains(`c__alert--${type}`) && alert.textContent?.includes(message),
    );
    expect(matchingAlert).toBeUndefined();
  });
};

export const expectNoAlertError = (message: string, rootElement: ParentNode = document) => {
  return expectNoAlert(VariantType.ERROR, message, rootElement);
};

export const expectNoAlertInfo = (message: string, rootElement: ParentNode = document) => {
  return expectNoAlert(VariantType.INFO, message, rootElement);
};

export const expectNoAlertSuccess = (message: string, rootElement: ParentNode = document) => {
  return expectNoAlert(VariantType.SUCCESS, message, rootElement);
};

export const expectNoAlertWarning = (message: string, rootElement: ParentNode = document) => {
  return expectNoAlert(VariantType.WARNING, message, rootElement);
};
