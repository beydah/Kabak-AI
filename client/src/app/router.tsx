import { createBrowserRouter } from 'react-router-dom';

import { F_Home_Page } from '@/features/landing/pages/home_page';
import { F_Contact_Page } from '@/features/contact/pages/contact_page';
import { F_Login_Page } from '@/features/auth/pages/login_page';
import { F_Collection_Page } from '@/features/collection/pages/collection_page';
import { F_New_Product_Page } from '@/features/new_product/pages/new_product_page';
import { F_Product_Page } from '@/features/product/pages/product_page';
import { F_Auth_Guard } from './auth_guard';

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
