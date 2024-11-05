import { useEffect, useState, useRef } from "react";
import StarRating from "./StarRating.js";

const omdbKey = "4e73b5d8";

const tempMovieData = [
  {
    imdbID: "tt1375666",
    Title: "Inception",
    Year: "2010",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
  },
  {
    imdbID: "tt0133093",
    Title: "The Matrix",
    Year: "1999",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
  },
  {
    imdbID: "tt6751668",
    Title: "Parasite",
    Year: "2019",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_SX300.jpg",
  },
];

const tempWatchedData = [
  {
    imdbID: "tt1375666",
    Title: "Inception",
    Year: "2010",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
    runtime: 148,
    imdbRating: 8.8,
    userRating: 10,
  },
  {
    imdbID: "tt0088763",
    Title: "Back to the Future",
    Year: "1985",
    Poster:
      "https://m.media-amazon.com/images/M/MV5BZmU0M2Y1OGUtZjIxNi00ZjBkLTg1MjgtOWIyNThiZWIwYjRiXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg",
    runtime: 116,
    imdbRating: 8.5,
    userRating: 9,
  },
];

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovieID, setSelectedMovieID] = useState(null);
  const [watched, setWatched] = useState(function () {
    const watchedList = localStorage.getItem("watchedList");
    return JSON.parse(watchedList);
  });
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [movieLoading, setMovieLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function handleSelectMovie(id) {
    setSelectedMovieID(id === selectedMovieID ? null : id);
  }

  function handleOnCloseMovie() {
    setMovieLoading(null);
    setSelectedMovieID(null);
  }

  function handleAddWatched(movie) {
    // if (!watched.find((element) => element.imdbID === movie.imdbID))
    setWatched((watchedMovies) => [...watchedMovies, movie]);
  }

  function handleDeleteWatchedMovie(id) {
    setWatched((wacthed) => watched.filter((movie) => movie.imdbID !== id));
  }

  //Fetch Query Movies
  useEffect(() => {
    const controller = new AbortController();

    async function getMoviesAPI() {
      const apiRequest = `http://www.omdbapi.com/?apikey=${omdbKey}&s=${query}`;
      try {
        setSelectedMovieID(null);
        setIsLoading(true);
        setErrorMsg("");
        const res = await fetch(apiRequest, { signal: controller.signal });
        if (!res.ok) {
          throw new Error();
        }
        const data = await res.json();
        if (data.Response === "False") throw new Error("Movies not found!");
        setMovies(data.Search);
        setErrorMsg("");
      } catch (error) {
        if (error instanceof TypeError) {
          setErrorMsg("Connection Lost...");
        } else {
          if (error.name !== "AbortError") setErrorMsg(error.message); // Other errors, such as the custom ones thrown above
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (query.length < 3) {
      setErrorMsg("");
      setMovies([]);
      return;
    }

    getMoviesAPI();
    return function () {
      controller.abort();
    };
  }, [query]);

  //Title on mount
  useEffect(() => {
    document.title = "usePopcorn";
  });

  //watchedList on LocalStorage
  useEffect(() => {
    localStorage.setItem("watchedList", JSON.stringify(watched));
  }, [watched]);

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
              setErrorMsg={setErrorMsg}
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

  useEffect(
    function () {
      function callback(e) {
        if (document.activeElement === inputEl.current) return;

        if (e.code === "Enter") {
          inputEl.current.focus();
          setQuery("");
        }
      }
      document.addEventListener("keydown", callback);

      return () => {
        document.removeEventListener("keydown", callback);
      };
    },
    [setQuery]
  );

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
        setErrorMsg("");
        const res = await fetch(apiRequest);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setMovieDetails(data);
      } catch (err) {
        if (err instanceof TypeError) {
          setErrorMsg("Connection Lost...");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchMovieByID();
  }, [selectedMovieID]);

  useEffect(
    function () {
      function callback(e) {
        if (e.code === "Escape") {
          onCloseMovie();
        }
      }

      document.addEventListener("keydown", callback);

      return function () {
        document.removeEventListener("keydown", callback);
      };
    },
    [onCloseMovie]
  );

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
