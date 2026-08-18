# Menu Entry Extension

The Menu Entry Extension is a feature in Richie that allows you to customize how pages appear in the
main navigation menu. It provides additional options to control the behavior and appearance of menu
items.

## Settings

Several settings allow to configure the behavior of this extension :
- `RICHIE_MAINMENUENTRY_ALLOW_CREATION`: Allow to add a menu entry extension on a existing page.
    If False, you will be able to only edit existing menu entry. Default to `False`, so that means
    that if you have never created a menu entry, you will not be able to create one. If you want to
    be able to create a menu entry on an existing page, you will need to set this to `True`.
- `RICHIE_MAINMENUENTRY_MENU_ALLOWED_LEVEL`: The page level at which it is allowed to attached
    a main menu entry. Default to `0`, only root pages are allowed to have a menu entry.
- `RICHIE_MENU_ENTRY_COLOR_CLASSES`: The color set choices to customize menu entries active state.
    The value expected is the name of a css class that will be applied to the menu entry item.
    Selected choice value will be used as a variant name in a classname prefixed with `topbar__item--`,
    so here for the *Red* it would be `topbar__item--red`. However it depends from your menu template.
    Then through this class you will be able to overidde the whole dropdown item style. As a shorcut
    you can simply override `--active-text-color` and `--active-background-color` properties to simply
    customize menu entry items background and text colors when it is active (hovered or focused).

    Example:
    ```py
    RICHIE_MENU_ENTRY_COLOR_CLASSES = (
        ("", "Default"),
        ("red-pill", "Red pill")
        ("blue-pill", "Blue pill")
    )
    ```
    ```scss
    .dropdown.topbar__item--red-pill {
        --active-background-color: #F00;
        --active-text-color: #FFF;
    }
    .dropdown.topbar__item--blue-pill {
        --active-background-color: #00F;
        --active-text-color: #FFF;
        & > button {
            border-radius: 50vw;
        }
    }
    ```

## Features

### Allow Submenu

The `allow_submenu` option enables dropdown functionality for menu items. When enabled:
- The menu item becomes a dropdown button
- All child pages are displayed in a submenu

### Menu Color

The `menu_color` option lets you customize the visual appearance of menu items. You can set:
- Background color for active/selected state
- Text color for active/selected state

The choices used are defined through `RICHIE_MENU_ENTRY_COLOR_CLASSES` settings.

## Usage

1. In the Django admin interface, navigate to the page you want to add a menu entry.
2. In the CMS Toolbar, go to Page/Main Menu Settings
    _If you don't see the "Main Menu Settings" option, please ensure that you have 
    set `RICHIE_MAINMENUENTRY_ALLOW_CREATION` to `True` in your settings and also you are on a
    a page of an allowed level (see `RICHIE_MAINMENUENTRY_MENU_ALLOWED_LEVEL` settings)._
3. Configure the following options:
   - **Allow submenu**: Check this box if you want the menu item to display its child pages in a dropdown
   - **Color in menu**: Select a predefined color scheme to customize the menu item's appearance

## HTML Structure

Take a look at `richie.apps.core.templates.menu.header_menu.html` to see the html template.
