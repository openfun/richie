describe('Program detail view', function() {
  beforeEach(() => {
    // Start from the programs list view (we know its URL)
    cy.visit('/en/programs/');
    // Move to the detail page for the first program we can find
    cy.get('.program-glimpse')
      .first()
      .click();
    cy.injectAxe();
  });

  it('passes axe a11y checks', () => {
    cy.checkA11y();
  });
});
