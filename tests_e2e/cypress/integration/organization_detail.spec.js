describe('Organizations detail view', function() {
  beforeEach(() => {
    // Start from the organizations list view (we know its URL)
    cy.visit('/en/organizations/');
    // Move to the detail page for the first organization we can find
    cy.get('.organization-glimpse')
      .first()
      .click();
    cy.injectAxe();
  });

  it('passes axe a11y checks', () => {
    cy.checkA11y();
  });
});
