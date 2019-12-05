describe('Courses list view', function() {
  beforeEach(() => {
    cy.visit('/en/courses/');
    cy.injectAxe();
  });

  it('passes axe a11y checks while loading search results', () => {
    cy.checkA11y();
  });

  it('passes axe a11y checks after search results are loaded', () => {
    // Wait for the course search API request to finish loading
    cy.contains('courses matching your search');
    cy.checkA11y();
  });
});
