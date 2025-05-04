import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';

function Login_in() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [registerDetails, setRegisterDetails] = useState([]);
  const navigate = useNavigate();
  
  function handleloginind(data) {
    console.log("Login Data: ", data);
    // Store user data in localStorage
    localStorage.setItem('individualUser', JSON.stringify({
      username: data.username
    }));
    navigate(`/individual/profile/${data.username}`);
  }

  return (
    <div className='min-vh-100 d-flex align-items-center justify-content-center' style={{backgroundColor:"#E8F5E9"}}>
      <form action="" className='col-6 col-md-5 col-lg-3 d-block mx-auto border border-light-subtle p-4 rounded-4 bg-white' onSubmit={handleSubmit(handleloginind)}>
        <h2 className='text-center mb-4'></h2>
        <p className='lead text-center fw-bold'>Welcome!</p>
        <p className='text-center lead fs-6'>Log in Support Roots to continue</p>
        
        <div className='mb-3'>
          <label htmlFor="" className='form-label'>Username</label>
          <input 
            type="text" 
            {...register("username", { required: true })} 
            className='form-control'
          />
          {errors.username?.type === 'required' && <p className='fs-6 text-danger'>*Username is required</p>}
        </div>

        <div className='mb-3'>
          <label htmlFor="" className='form-label'>Password</label>
          <input 
            type="password" 
            {...register("password", { 
              required: true,
              minLength: 8,
              maxLength: 16
            })} 
            className='form-control'
          />
          {errors.password?.type === 'required' && <p className='fs-6 text-danger'>*Password is required</p>}
          {errors.password?.type === 'minLength' && <p className='fs-6 text-danger'>*Password must be at least 8 characters</p>}
          {errors.password?.type === 'maxLength' && <p className='fs-6 text-danger'>*Password must not exceed 16 characters</p>}
        </div>
        
        <div className='d-flex justify-content-center'>
          <button className="btn btn-primary my-3 p-2" style={{backgroundColor:"#00897B",border:"none"}}>Login</button>
        </div>
        
        <Link to="/individual/register" className="text-decoration-none">Don't have an account? Register</Link>
      </form>
    </div>
  );
}

export default Login_in;