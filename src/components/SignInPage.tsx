import React, { useState, useCallback } from 'react'
import { RouteComponentProps, Link } from '@reach/router'
import ReactGA from 'react-ga'
import useForm from 'hooks/useForm'
import { signIn } from 'auth'
import PublicHeader from 'components/PublicHeader'

type SignInValues = {
  email: string
  password: string
}

const initialFormValues = {
  email: '',
  password: ''
}

const SignInPage: React.FC<RouteComponentProps> = ({ navigate }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState()
  const { handleSubmit, fieldProps } = useForm<SignInValues>(initialFormValues)

  const loginUser = useCallback(
    async (values: SignInValues) => {
      try {
        setIsLoading(true)
        setError(undefined)

        await signIn(values)

        ReactGA.event({
          category: 'User',
          action: 'Sign In'
        })
        navigate && navigate('/notes')
      } catch (error) {
        setIsLoading(false)
        setError(error.message)
      }
    },
    [navigate]
  )

  return (
    <div className="container h-100">
      <PublicHeader />

      <div className="row py-3 py-lg-5">
        <div className="col-lg-8">
          <h1 className="display-2 font-weight-bold">
            Welcome back to your notes app.{' '}
            <span className="text-muted font-weight-normal">
              Just simple, just notes.
            </span>
          </h1>
        </div>
        <div className="col-lg-4">
          <form onSubmit={handleSubmit(loginUser)}>
            <div className="form-group mt-4">
              <label htmlFor="email">E-mail</label>
              <input
                required
                autoFocus
                type="email"
                className="form-control"
                {...fieldProps('email')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                required
                type="password"
                className="form-control"
                {...fieldProps('password')}
              />
            </div>

            <div className="form-group">
              <button className="btn btn-dark btn-block" disabled={isLoading}>
                {isLoading ? 'Login...' : 'Login'}
              </button>
              <Link to="/register" className="btn btn-light btn-block">
                Register
              </Link>
              {error && <p className="text-danger text-center p-3">{error}</p>}
            </div>
          </form>
        </div>
      </div>

      <footer className="py-4">
        <p>
          We{' '}
          <span role="img" aria-label="heart">
            ❤️
          </span>
          Open Source.
          <a
            href="https://github.com/BrunoQuaresma/justnotes.io"
            className="ml-1"
          >
            Check here the source code.
          </a>
        </p>
      </footer>
    </div>
  )
}

export default SignInPage
