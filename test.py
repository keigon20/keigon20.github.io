import requests
from bs4 import BeautifulSoup


def print_secret_message(doc_url: str) -> None:
    response = requests.get(doc_url)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    rows = soup.find_all("tr")

    points = []

    for row in rows[1:]:
        cols = [c.get_text(strip=True) for c in row.find_all(["td", "th"])]

        if len(cols) != 3:
            continue

        x = int(cols[0])
        char = cols[1]
        y = int(cols[2])

        points.append((x, y, char))

    if not points:
        return

    max_x = max(x for x, _, _ in points)
    max_y = max(y for _, y, _ in points)

    grid = [[" " for _ in range(max_x + 1)] for _ in range(max_y + 1)]

    for x, y, char in points:
        grid[y][x] = char

    for y in range(max_y, -1, -1):
        print("".join(grid[y]))

print_secret_message("https://docs.google.com/document/d/e/2PACX-1vSvM5gDlNvt7npYHhp_XfsJvuntUhq184By5xO_pA4b_gCWeXb6dM6ZxwN8rE6S4ghUsCj2VKR21oEP/pub")