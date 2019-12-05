describe('Categories meta list view', function() {
  beforeEach(() => {
    cy.visit('/en/categories/');
    cy.injectAxe();
  });

  it('passes axe a11y checks', () => {
    cy.checkA11y();
  });
});
