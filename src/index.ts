import { AppProps } from 'next/app'
import { useEffect, useRef } from 'react'
import { NavigationHistory as NavigationHistory, NavigationHistoryOptions } from './navigation_history'
import { ClientNavigationHistory as ClientNavigationHistory } from './navigation_history.client'
import { ServerNavigationHistory as ServerNavigationHistory } from './navigation_history.server'

export * from './navigation_history'

let navigationHistory: NavigationHistory

export function withNavigationHistory(app: (props: AppProps) => JSX.Element, options: NavigationHistoryOptions = {}): (props: AppProps) => JSX.Element {
  if (typeof window !== "undefined") {
    navigationHistory = new ClientNavigationHistory(options)
  } else {
    navigationHistory = new ServerNavigationHistory(options)
  }

  return app
}

export function useNavigationHistory(): NavigationHistory<undefined>;
export function useNavigationHistory<T=Record<string, any>>(
  backup: () => T
): NavigationHistory<T>;
export function useNavigationHistory<T=Record<string, any>>(
  backup?: () => T
): NavigationHistory {
  if (!backup) {
    return navigationHistory
  }

  const flag = useRef(false)
  const state = useRef<T>()
  state.current = backup()

  useEffect(() => {
    if (typeof window === "undefined" || flag.current) {
      return
    }
    flag.current = true

    const instance = navigationHistory as ClientNavigationHistory
    if (!instance) {
      throw new Error('navigationHistory is not initialized.')
    }
    instance._callback = () => {
      const backupState = state.current || {}
      if (instance.options.debug) {
        console.log(`backup: state=${JSON.stringify(backupState)}`)
      }
      return backupState
    }
  }, [])

  return navigationHistory
}
