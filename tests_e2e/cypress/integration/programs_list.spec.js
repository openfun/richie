describe('Programs list view', function() {
  beforeEach(() => {
    cy.visit('/en/programs/');
    cy.injectAxe();
  });

  it('passes axe a11y checks', () => {
    cy.contains('Programs')
    cy.checkA11y();
  });
});
