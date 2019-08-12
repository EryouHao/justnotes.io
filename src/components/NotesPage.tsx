import React, { useEffect, useCallback, useMemo, useRef, Fragment } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PayloadAction } from 'redux-starter-kit'
import ReactGA from 'react-ga'
import { format } from 'timeago.js'
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalBody
} from 'reactstrap'
import { RouteComponentProps } from '@reach/router'
import { logout } from 'auth'
import {
  selectNotes,
  selectLoadingState,
  fetchNotes,
  updateNoteById,
  createNote,
  deleteNoteById,
  NoteItem
} from 'stores/noteStore'
import {
  selectNote,
  updateContent,
  selectBoard,
  selectNoteToDelete,
  clearDelete,
  clearSelect
} from 'stores/boardStore'
import { ThunkDispatch } from 'redux-thunk'

let timeouts: { [key: string]: number } = {}

const NotesPage: React.FC<RouteComponentProps> = ({ navigate }) => {
  const dispatch = useDispatch<ThunkDispatch<any, any, PayloadAction>>()
  const notes: NoteItem[] = useSelector(selectNotes)
  const loadingState = useSelector(selectLoadingState)
  const boardState = useSelector(selectBoard)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const hasNotes = useMemo(() => notes && notes.length > 0, [notes])

  useEffect(() => {
    dispatch(fetchNotes())
  }, [dispatch])

  const focusTextarea = useCallback(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus()
    }
  }, [])

  const handleNoteClick = useCallback(
    (note: NoteItem) => {
      dispatch(selectNote(note))
      focusTextarea()
    },
    [dispatch, focusTextarea]
  )

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = event.currentTarget.value
      dispatch(updateContent(newContent))

      const { selectedNoteId } = boardState
      window.clearInterval(timeouts[selectedNoteId])
      timeouts[selectedNoteId] = window.setTimeout(() => {
        dispatch(updateNoteById(selectedNoteId, { content: newContent }))
        ReactGA.event({
          category: 'Note',
          action: 'Update'
        })
      }, 1000)
    },
    [boardState, dispatch]
  )

  const handleNewClick = useCallback(async () => {
    const newNote = await dispatch(createNote())

    if (!newNote) return

    ReactGA.event({
      category: 'Note',
      action: 'Create'
    })

    dispatch(selectNote(newNote))
    focusTextarea()
  }, [dispatch, focusTextarea])

  const handleDropdownClick = useCallback(
    (event: React.MouseEvent) => event.stopPropagation(),
    []
  )

  const handleNoteDelete = useCallback(
    (note: NoteItem, event: React.MouseEvent) => {
      event.stopPropagation()
      dispatch(selectNoteToDelete(note))
    },
    [dispatch]
  )

  const handleNoteDeleteCancel = useCallback(() => {
    dispatch(clearDelete())
  }, [dispatch])

  const handleDeleteModalConfirm = useCallback(async () => {
    const { selectedNoteId, noteIdToDelete } = boardState
    await dispatch(deleteNoteById(noteIdToDelete))
    ReactGA.event({
      category: 'Note',
      action: 'Delete'
    })
    if (selectedNoteId === noteIdToDelete) {
      dispatch(clearSelect())
    }
    dispatch(clearDelete())
  }, [boardState, dispatch])

  const handleLogout = useCallback(() => {
    logout()
    ReactGA.event({
      category: 'User',
      action: 'Logout'
    })
    navigate && navigate('/')
  }, [navigate])

  if (loadingState.isLoading)
    return (
      <div className="h-100 w-100 d-flex align-items-center justify-content-center">
        Loading...
      </div>
    )

  return (
    <Fragment>
      <div className="notes container-fluid">
        <div className="row">
          <div className="scrollable-y col-md-4 col-lg-3 bg-light p-3">
            <button
              onClick={handleNewClick}
              className="btn btn-block btn-primary mb-3"
              disabled={loadingState.isCreating}
            >
              {loadingState.isCreating ? 'Creating...' : 'New note'}
            </button>

            {notes.map(note => (
              <div
                onClick={() => handleNoteClick(note)}
                className={`note card mb-1 ${note.id ===
                  boardState.selectedNoteId && 'note--active'}`}
                key={note.id}
              >
                <div className="card-body">
                  <div className="note__options">
                    <UncontrolledDropdown>
                      <DropdownToggle
                        color="light"
                        size="sm"
                        onClick={handleDropdownClick}
                      >
                        <i className="fas fa-ellipsis-h" />
                      </DropdownToggle>
                      <DropdownMenu right>
                        <DropdownItem header>Actions</DropdownItem>
                        <DropdownItem
                          className="text-danger"
                          onClick={event => handleNoteDelete(note, event)}
                        >
                          Remove
                        </DropdownItem>
                      </DropdownMenu>
                    </UncontrolledDropdown>
                  </div>

                  <p className="note__content">
                    {note.content || (
                      <span className="text-muted">No content</span>
                    )}
                  </p>

                  <small className="note__info text-muted">
                    {format(note.ts / 1000)}
                  </small>
                </div>
              </div>
            ))}
          </div>

          <div className="d-md-flex flex-column col-md-8 col-lg-9 p-3">
            <div className="row px-3 py-1 mb-3">
              <UncontrolledDropdown className="ml-auto">
                <DropdownToggle outline color="secondary" size="sm" caret>
                  My account
                </DropdownToggle>
                <DropdownMenu right>
                  <DropdownItem onClick={handleLogout}>Logout</DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </div>

            {boardState.selectedNoteId ? (
              <textarea
                ref={textAreaRef}
                value={boardState.content}
                onChange={handleTextChange}
                placeholder="Type your note here..."
              />
            ) : (
              <div className="notes__empty h-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <p className="display-3 text-muted">
                    {hasNotes ? 'Select a note' : 'Start use notes'}
                  </p>

                  {!hasNotes && (
                    <button
                      onClick={handleNewClick}
                      className="btn btn-primary"
                      type="button"
                      disabled={loadingState.isCreating}
                    >
                      {loadingState.isCreating
                        ? 'Creating...'
                        : 'Create your first note'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!boardState.noteIdToDelete}
        toggle={handleNoteDeleteCancel}
      >
        <ModalBody>
          <div className="p-4">
            <div className="text-center mb-3 lead">
              Do you really want to delete this note?
            </div>
            <div className="text-center">
              <button
                className="btn text-muted"
                onClick={handleNoteDeleteCancel}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteModalConfirm}
                className="btn btn-outline-danger ml-1"
                disabled={loadingState.isDeleting}
              >
                {loadingState.isDeleting ? 'Deleting...' : 'Delete note'}
              </button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </Fragment>
  )
}

export default NotesPage
