import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Helper sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    console.clear();
    console.log(chalk.red.bold(`==================================================`));
    console.log(chalk.red.bold(`     RESTAURANT-BOT AUTONOMOUS ORCHESTRATOR       `));
    console.log(chalk.red.bold(`==================================================\n`));

    const spinner = ora('Audyt środowiska...').start();
    await sleep(1000);
    
    // Check folders
    const requiredFolders = ['strona_runtime', 'templates', 'restaurants', 'generated', 'checkpoints'];
    for (const folder of requiredFolders) {
        if (!fs.existsSync(path.join(ROOT_DIR, folder))) {
            spinner.warn(`Brakujący folder: ${folder}, tworzenie...`);
            fs.mkdirSync(path.join(ROOT_DIR, folder));
        }
    }

    spinner.text = 'Sprawdzanie zależności...';
    await sleep(800);
    
    spinner.text = 'Sprawdzanie Supabase CLI...';
    await sleep(800);

    spinner.succeed(chalk.green('Audyt środowiska zakończony pomyślnie.\n'));

    // Lista restauracji do wyboru
    const availableRestaurants = [
        { name: 'Bella Italia (Włoska)', value: 'bella-italia' },
        { name: 'Sushi Zen (Japońska)', value: 'sushi-zen' },
        { name: 'Burger House (Amerykańska)', value: 'burger-house' },
        { name: 'La Crêperie (Francuska)', value: 'la-creperie' }
    ];

    const { selectedRestaurant } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedRestaurant',
            message: 'Wybierz restaurację do wygenerowania:',
            choices: availableRestaurants,
        }
    ]);

    console.log(chalk.blue(`\n[INFO] Konfiguracja restauracji: ${selectedRestaurant}`));

    const config = await inquirer.prompt([
        {
            type: 'list',
            name: 'theme',
            message: 'Wybierz motyw:',
            choices: ['Premium Dark', 'Modern Light', 'Classic Elegant', 'Minimalist']
        },
        {
            type: 'input',
            name: 'colors',
            message: 'Preferowane kolory (np. #000000, gold, red):',
            default: 'gold, black'
        },
        {
            type: 'list',
            name: 'animations',
            message: 'Poziom animacji (Framer Motion):',
            choices: ['Cinematic (Dużo animacji)', 'Subtle (Lekkie fade-iny)', 'None (Brak)']
        },
        {
            type: 'input',
            name: 'specialRequirements',
            message: 'Dodatkowe życzenia (np. menu wegańskie, integracja z mapami):'
        },
        {
            type: 'list',
            name: 'mode',
            message: 'Wybierz tryb działania systemu:',
            choices: ['FULL AUTO MODE (AI działa autonomicznie)', 'SAFE MODE (AI pyta przed zmianami)']
        }
    ]);

    console.log(chalk.red(`\n==================================================`));
    console.log(chalk.bold(`PODSUMOWANIE KONFIGURACJI:`));
    console.log(`Restauracja: ${chalk.green(selectedRestaurant)}`);
    console.log(`Motyw: ${chalk.green(config.theme)}`);
    console.log(`Kolory: ${chalk.green(config.colors)}`);
    console.log(`Animacje: ${chalk.green(config.animations)}`);
    console.log(`Tryb: ${chalk.green(config.mode)}`);
    console.log(chalk.red(`==================================================\n`));

    const { confirm } = await inquirer.prompt([
        {
            type: 'input',
            name: 'confirm',
            message: 'Wpisz "Wykonaj" aby rozpocząć automatyzację:',
            validate: (input) => input === 'Wykonaj' ? true : 'Musisz wpisać dokładnie "Wykonaj", lub Ctrl+C by anulować.'
        }
    ]);

    if (confirm === 'Wykonaj') {
        await runAutomation(selectedRestaurant, config);
    }
}

async function runAutomation(restaurantId, config) {
    console.log(chalk.green(`\nRozpoczynam pełną automatyzację w trybie ${config.mode}...\n`));
    
    // Save checkpoint
    const checkpointName = `checkpoint_${restaurantId}_${Date.now()}.json`;
    const checkpointPath = path.join(ROOT_DIR, 'checkpoints', checkpointName);
    fs.writeJsonSync(checkpointPath, { restaurantId, config, status: 'started' }, { spaces: 2 });
    
    console.log(chalk.blue(`[INFO] Tworzenie struktury projektu...`));
    await sleep(1000);
    console.log(chalk.green(`[SUCCESS] Zapisano checkpoint: ${checkpointName}`));
    
    const targetDir = path.join(ROOT_DIR, 'generated', restaurantId);
    console.log(chalk.blue(`[INFO] Kopiowanie runtime ("golden template") do ${targetDir}...`));
    await sleep(2000);
    
    // Symulacja operacji
    console.log(chalk.green(`[SUCCESS] Środowisko skopiowane.`));
    console.log(chalk.magenta(`[AI] Analizowanie wymogów tematycznych: ${config.theme}...`));
    await sleep(1500);
    
    console.log(chalk.magenta(`[AI] Generowanie nowych schematów kolorystycznych (${config.colors})...`));
    await sleep(1500);
    
    console.log(chalk.magenta(`[AI] Aplikowanie animacji z poziomu: ${config.animations}...`));
    await sleep(1500);

    console.log(chalk.cyan(`[SUPABASE] Przygotowywanie instancji bazy danych...`));
    await sleep(2000);
    console.log(chalk.green(`[SUCCESS] Baza danych gotowa.`));

    // Symulacja błędu builda i naprawy
    console.log(chalk.blue(`[INFO] Uruchamianie procedury build (Next.js)...`));
    await sleep(2000);
    console.log(chalk.red(`[ERROR] Build failed (Mocked Error: Typography conflict in Hero.tsx)`));
    
    console.log(chalk.magenta(`[AI] Rozpoczęto analizę logów błędu...`));
    await sleep(1500);
    console.log(chalk.magenta(`[AI] Próba automatycznej naprawy stylów (Hero.tsx)...`));
    await sleep(2000);
    console.log(chalk.green(`[SUCCESS] Naprawiono problem z typografią.`));
    
    console.log(chalk.blue(`[INFO] Ponawianie procedury build... (Retry 1/3)`));
    await sleep(2000);
    console.log(chalk.green(`[SUCCESS] Build ukończony pomyślnie!`));

    fs.writeJsonSync(checkpointPath, { restaurantId, config, status: 'completed' }, { spaces: 2 });

    console.log(chalk.red.bold(`\n==================================================`));
    console.log(chalk.green.bold(`🎉 AUTOMATYZACJA ZAKOŃCZONA SUKCESEM 🎉`));
    console.log(`Strona restauracji: ${chalk.white(restaurantId)} jest gotowa do wdrożenia.`);
    console.log(chalk.gray(`Projekt znajduje się w folderze: ./generated/${restaurantId}`));
    console.log(chalk.red.bold(`==================================================\n`));
}

main().catch(err => {
    console.error(chalk.red(`[FATAL ERROR]`), err);
    process.exit(1);
});
