import {Routes, Route, Navigate} from 'react-router-dom'
import Redirect from './pages/redirect'
import Menfess from './pages/menfess/form-menfess'
import Aspirasi from './pages/aspirasi/form-aspirasi'
import LoginAdmin from './pages/auth/login-admin'
import BlankLayout from './layouts/blankLayout'
import MainLayout from './layouts/mainLayout'
import './App.css'

function App() {
  return (
    <Routes>
        {/* halaman redirect */}
        <Route element={<BlankLayout/>} >
            <Route index  element={<Redirect/>} />
        </Route>
        <Route path='/menfess'  element={<MainLayout/>} >

            {/* halaman form menfess*/}
            <Route index element={<Menfess/> }/>

        </Route>
        <Route path='/aspirasi'  element={<MainLayout/>} >
            {/* halama form aspirasi */}
            <Route index element={<Aspirasi/>} ></Route>
        </Route>

        <Route path='/login-admin' element={<BlankLayout/>}  >
			<Route index element={<LoginAdmin/>} ></Route>
        </Route>
    </Routes>
  )
}


export default App