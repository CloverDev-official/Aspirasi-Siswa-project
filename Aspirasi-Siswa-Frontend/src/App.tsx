import {Routes, Route} from 'react-router-dom'
import './App.css'
// layout
import BlankLayout from './layouts/blankLayout'
import MainLayout from './layouts/mainLayout'

// user
import BerandaUser from './pages/user/beranda'
import Menfess from './pages/user/form-menfess'
import Aspirasi from './pages/user/form-aspirasi'
import Songfess from './pages/user/form-songfess'
import NotFoundPage from './pages/not-found'

// admin
import LoginAdmin from './pages/auth/login-admin'
import BerandaAdmin from './pages/admin/beranda'
import ListMenfess from './pages/admin/list-menfess'
import ListAspirasi from './pages/admin/list-aspirasi'
import ListSongfess from './pages/admin/list-songfess'
import Template from './pages/admin/template'
import JadwalAdmin from './pages/admin/jadwal'
import AdminMiddleware from './middleware/adminMiddleware'

function App() {
  return (
    <Routes>
        {/* user */}
        <Route path='/'  element={<BlankLayout/>} >
            {/* halaman beranda user */}
            <Route index  element={<BerandaUser/>} />
        </Route>
        <Route path='/menfess' element={<MainLayout/>} >
            {/* halaman form menfess*/}
            <Route index element={<Menfess/> }/>

        </Route>
        <Route path='/songfess' element={<MainLayout/>} >
            {/* halaman form songfess*/}
            <Route index element={<Songfess/> }/>

        </Route>
        <Route path='/aspirasi'  element={<MainLayout/>} >
            {/* halama form aspirasi */}
            <Route index element={<Aspirasi/>} ></Route>
        </Route>

        {/* admin */}
        <Route path='/admin' element={<BlankLayout/>}  >
			<Route index element={<LoginAdmin/>} ></Route>
            <Route path='beranda' element={<AdminMiddleware><BerandaAdmin/></AdminMiddleware>} ></Route>
        </Route>
        <Route path='/admin' element={<AdminMiddleware><MainLayout/></AdminMiddleware>} >
            <Route path='list-menfess' element={<ListMenfess/>} ></Route>
            <Route path='list-songfess' element={<ListSongfess/>} ></Route>
            <Route path='list-aspirasi' element={<ListAspirasi/>} ></Route>
            <Route path='template' element={<Template/>} ></Route>
                        <Route path='jadwal' element={<JadwalAdmin/>} ></Route>
        </Route>

                <Route path='*' element={<BlankLayout/>}>
                        <Route index element={<NotFoundPage/>} />
                </Route>
    </Routes>
  )
}


export default App