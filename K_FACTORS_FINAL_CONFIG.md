# K-Factors Final Config

Tabella di riferimento rapido della configurazione oggi implementata.

## K standard

```js
{
  "TorneOtto 30'": 16,
  "Americano": 24,
  "Round Robin + Finali": 28,
  "Friendly Match": 20,
  "Beat the Box": 16,
  "Torneo Libero": 24
}
```

Nota: per `Round Robin + Finali` il valore base `28` non e' usato quando il match appartiene a una fase riconosciuta, perche' entrano in gioco i K specifici di fase.

## Round Robin + Finali

```js
{
  roundRobin: 10,
  finals1st2ndWinner: 32,
  finals1st2ndLoser: 10,
  finals3rd4thWinner: 4,
  finals3rd4thLoser: 24
}
```

## Gironi + Fase Finale

```js
{
  gironi: 14,
  semifinals: 20,
  finals3rd4thWinner: 8,
  finals3rd4thLoser: 20,
  finals1st2ndWinner: 38,
  finals1st2ndLoser: 10
}
```
