import { PERRINNPage } from './app.po';

describe('perrinn App', () => {
  let page: PERRINNPage;

  beforeEach(() => {
    page = new PERRINNPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
