describe('Person detail view', function() {
  beforeEach(() => {
    // Start from the persons list view (we know its URL)
    cy.visit('/en/persons/');
    // Move to the detail page for the first person we can find
    cy.get('.person-glimpse__media')
      .first()
      .click();
    cy.injectAxe();
  });

  it('passes axe a11y checks', () => {
    cy.checkA11y();
  });
});
