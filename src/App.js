import { useEffect, useState, useRef } from "react";
import StarRating from "./StarRating.js";
import { useMovies } from "./useMovies.js";
import { useLocalStorageState } from "./useLocalStorageState.js";
import { useKey } from "./useKey.js";

const omdbKey = "4e73b5d8";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
  const [query, setQuery] = useState("");
  //FetchMovies
  const { movies, isLoading, errorMsg } = useMovies(query);
  const [selectedMovieID, setSelectedMovieID] = useState(null);

  const [watched, setWatched] = useLocalStorageState([], "moviesWatched");

  function handleSelectMovie(id) {
    setSelectedMovieID(id === selectedMovieID ? null : id);
  }

  function handleOnCloseMovie() {
    setSelectedMovieID(null);
  }

  function handleAddWatched(movie) {
    // if (!watched.find((element) => element.imdbID === movie.imdbID))
    setWatched((watchedMovies) => [...watchedMovies, movie]);
  }

  function handleDeleteWatchedMovie(id) {
    setWatched((wacthed) => watched.filter((movie) => movie.imdbID !== id));
  }

  //Title on mount
  useEffect(() => {
    document.title = "usePopcorn";
  });

  return (
    <>
      <NavBar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>

      <Main>
        <Box>
          {errorMsg && <ErrorMessage message={errorMsg} />}
          {isLoading && !errorMsg && <Loader />}
          {!isLoading && !errorMsg && (
            <MovieList movies={movies} onSelectedMovieID={handleSelectMovie} />
          )}
        </Box>

        <Box>
          {selectedMovieID ? (
            <MovieDetails
              selectedMovieID={selectedMovieID}
              onCloseMovie={handleOnCloseMovie}
              // setErrorMsg={setErrorMsg}
              onAddWatched={handleAddWatched}
              watchedMovies={watched}
            ></MovieDetails>
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMovieList
                watched={watched}
                onDeletedWatched={handleDeleteWatchedMovie}
              />
            </>
          )}
          {errorMsg && <ErrorMessage message={errorMsg} />}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return <p className="error">{message}</p>;
}

function NavBar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  const handleChange = (e) => {
    const newTitle = e;
    setQuery(newTitle);
  };

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;

    inputEl.current.focus();
    setQuery("");
  });

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => handleChange(e.target.value)}
      ref={inputEl}
    />
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectedMovieID }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          onSelectedMovieID={onSelectedMovieID}
        />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectedMovieID }) {
  return (
    <li
      key={movie.imdbID}
      onClick={() => {
        onSelectedMovieID(movie.imdbID);
      }}
    >
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({
  selectedMovieID,
  onCloseMovie,
  setErrorMsg,
  onAddWatched,
  watchedMovies,
}) {
  const [movieDetails, setMovieDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  const countRef = useRef(0);

  useEffect(() => {
    if (userRating) countRef.current++;
  }, [userRating]);

  const isWatched = watchedMovies
    .map((movie) => movie.imdbID)
    .includes(selectedMovieID);

  const watchedUserRating = watchedMovies.find(
    (movie) => movie.imdbID === selectedMovieID
  )?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movieDetails;

  //Fetch Movie By ID
  useEffect(() => {
    async function fetchMovieByID() {
      const apiRequest = `http://www.omdbapi.com/?apikey=${omdbKey}&i=${selectedMovieID}`;
      setIsLoading(true);
      try {
        setMovieDetails("");
        setErrorMsg?.("");
        const res = await fetch(apiRequest);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setMovieDetails(data);
      } catch (err) {
        if (err instanceof TypeError) {
          setErrorMsg?.("Connection Lost...");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovieByID();
  }, [selectedMovieID]);

  useKey("Escape", onCloseMovie);

  function handleAdd() {
    if (!movieDetails) return;
    const newWatchedMovie = {
      imdbID: selectedMovieID,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      countRatingDecisions: countRef.current,
    };

    onAddWatched(newWatchedMovie);
    onCloseMovie(null);
  }

  //Title change
  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;

      return function () {
        document.title = "usePopcorn";
      };
    },
    [title]
  );

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="details">
          <header>
            <button className="btn-back" onClick={() => onCloseMovie(null)}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${selectedMovieID}`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐</span>
                {imdbRating} IMDb Rating
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  {userRating && (
                    <button className="btn-add" onClick={handleAdd}>
                      + Add to List
                    </button>
                  )}
                </>
              ) : (
                <p>Your Rating: {watchedUserRating}</p>
              )}
            </div>
            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </div>
      )}
    </>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMovieList({ watched, onDeletedWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          deleteMovie={onDeletedWatched}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, deleteMovie }) {
  return (
    <li key={movie.imdbID}>
      <img src={movie.poster} alt={`${movie.Title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          className="btn-delete"
          onClick={() => deleteMovie(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
}
