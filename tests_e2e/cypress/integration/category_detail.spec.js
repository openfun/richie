describe('Category detail view', function() {
  beforeEach(() => {
    cy.visit('/en/categories/subject/');
    cy.injectAxe();
  });

  it('passes axe a11y checks', () => {
    cy.checkA11y();
  });
});
