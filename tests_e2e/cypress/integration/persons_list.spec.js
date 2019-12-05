describe('Persons list view', function() {
  beforeEach(() => {
    cy.visit('/en/persons/');
    cy.injectAxe();
  });

  it('passes axe a11y checks', () => {
    cy.checkA11y();
  });
});
