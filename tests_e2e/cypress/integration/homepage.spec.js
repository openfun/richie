describe('Homepage', function() {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe();
  });

  it('redirects to the default language version', function() {
    cy.url().should('include', '/en/');
  });

  it('passes axe a11y checks on load', () => {
    cy.checkA11y();
  });
});
