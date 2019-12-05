describe('Organizations list view', function() {
  beforeEach(() => {
    cy.visit('/en/organizations/');
    cy.injectAxe();
  });

  it('passes axe a11y checks', () => {
    cy.checkA11y();
  });
});
