import { createBrowserRouter } from 'react-router-dom';

import { F_Home_Page } from '../pages/home/home_page';
import { F_Contact_Page } from '../pages/contact/contact_page';
import { F_Login_Page } from '../pages/login/login_page';
import { F_Collection_Page } from '../pages/collection/collection_page';
import { F_New_Product_Page } from '../pages/new_product/new_product_page';
import { F_Product_Page } from '../pages/product/product_page';
import { F_Auth_Guard } from '../layout/auth_guard';

export const app_router = createBrowserRouter([
    {
        path: '/',
        element: <F_Home_Page />,
    },
    {
        path: '/contact',
        element: <F_Contact_Page />,
    },
    {
        path: '/login',
        element: <F_Login_Page />,
    },
    {
        path: '/collection',
        element: (
            <F_Auth_Guard>
                <F_Collection_Page />
            </F_Auth_Guard>
        ),
    },
    {
        path: '/new-product',
        element: (
            <F_Auth_Guard>
                <F_New_Product_Page />
            </F_Auth_Guard>
        ),
    },
    {
        path: '/product/:id',
        element: (
            <F_Auth_Guard>
                <F_Product_Page />
            </F_Auth_Guard>
        ),
    },
]);
