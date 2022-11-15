<script setup lang="ts">
import { onMounted, reactive, watch } from "vue";
import { Runrunit, type Board, type Stage, type Task } from "@/runrunit";
import { isNil } from "lodash";
import { addDays, formatISO } from "date-fns";

let runrunit: Runrunit;

const authData = reactive({
  appToken: "",
  userToken: "",
});

const data = reactive({
  loading: false,
  boards: [] as Board[],
  selectedBoard: {} as Board,
  stages: [] as Stage[],
  selectedSourceStage: -1,
  selectedDestinationStage: -1,
  selectedActionId: "",
  selectedConditionId: "",
  selectedUpdateConditionId: "",
  previewed: false,
  tasks: [] as Task[],
});

const conditions = [
  {
    id: "with_desired_date",
    label: "Todas as que possuem data de entrega (desired date)",
    filter: (task: Task) => !isNil(task.desired_date),
  },
  {
    id: "with_desired_date_today",
    label: "Apenas as com data de entrega (desired date) para hoje",
    filter: (task: Task) => task.desired_date === formatISO(new Date(), { representation: "date" }),
  },
  {
    id: "with_desired_date_tomorrow",
    label: "Apenas as com data de entrega (desired date) para amanhã",
    filter: (task: Task) => task.desired_date === formatISO(addDays(new Date(), 1), { representation: "date" }),
  },
] as const;

const updateConditions = [
  {
    id: "set_desired_date",
    tooltip: "Definir data de entrega (desired date) para 19h do dia da data de início (desired start date), para as tasks que possuem data de início e não possuem data de entrega",
    label: "Definir data de entrega para 19h do dia da data de início, para as tasks que possuem data de início e não possuem data de entrega",
    filter: (task: Task) => isNil(task.desired_date) && !isNil(task.desired_start_date),
    action: (tasks: Task[]) => runrunit.updateDesiredDate(tasks),
  },
] as const;

const actions = [
  { id: "move", label: "Mover tasks em massa", conditions, selected: "selectedConditionId" },
  { id: "update", label: "Alterar tasks em massa", conditions: updateConditions, selected: "selectedUpdateConditionId" },
] as const;

const listBoards = async () => {
  runrunit = new Runrunit(authData.appToken, authData.userToken);
  data.boards = await runrunit.listBoards();
  data.selectedBoard = data.boards[0];
  await listStages();
};

const listStages = async () => {
  data.stages = await runrunit.listStages(data.selectedBoard.id);
};

const getSelectedCondition = () => {
  const selectedAction = actions.find((action) => action.id === data.selectedActionId)!;
  const listOfConditions: readonly {
    readonly id: string;
    readonly label: string;
    readonly filter: (task: Task) => boolean;
  }[] = selectedAction.conditions;

  return listOfConditions.find((condition) => condition.id === data[selectedAction.selected]);
};

const listTasks = async () => {
  data.previewed = true;
  data.loading = true;
  const selectedCondition = getSelectedCondition()!;
  await runrunit.listTasks(data.selectedBoard.id, data.selectedSourceStage, selectedCondition.filter)
    .then((tasks) => data.tasks = tasks)
    .catch(() => data.tasks = [])
    .finally(() => {
      data.loading = false;
    });
};

const defineHour = (date: string, hour: number) => {
  return runrunit.defineHour(date, hour);
};

const moveTasks = async () => {
  data.loading = true;
  await runrunit.moveTasks(data.tasks, data.selectedSourceStage, data.selectedDestinationStage)
    .finally(async () => {
      await listTasks();
      data.loading = false;
    });
};

const updateTasks = async () => {
  data.loading = true;
  const selectedCondition = updateConditions.find((condition) => condition.id === data.selectedUpdateConditionId)!;
  await selectedCondition.action(data.tasks)
    .catch((err) => {
      data.tasks = [];
      // eslint-disable-next-line no-console
      console.error("Erro ao atualizar tasks", err);
    })
    .finally(async () => {
      await listTasks();
      data.loading = false;
    });
};

onMounted(async () => {
  if (localStorage.appToken || localStorage.userToken) {
    authData.appToken = localStorage.appToken;
    authData.userToken = localStorage.userToken;
  }
  await listBoards();
});

watch(authData,
  async (newValue) => {
    localStorage.appToken = newValue.appToken;
    localStorage.userToken = newValue.userToken;
    await listBoards();
  },
  { deep: true },
);

</script>

<template>
  <div class="container">
    <h1 class="m-3 text-center display-6">Runrunit Automações</h1>
    <div class="card mb-4">
      <div class="card-header">
        <font-awesome-icon icon="key" />
        Configurações de acesso ao Runrunit
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-sm mb-2">
            <label for="appToken" class="form-label">App Token</label>
            <a class="m-2" href="https://runrun.it/integrations/api_webhooks" target="_blank"
              title="Clique para buscar o token no seu Runrunit">
              <font-awesome-icon icon="external-link-alt" />
            </a>
            <input type="password" class="form-control" id="appToken" v-model="authData.appToken"
              @focusout="listBoards">
          </div>
          <div class="col-sm mb-2">
            <label for="userToken" class="form-label">User Token</label>
            <input type="password" class="form-control" id="userToken" v-model="authData.userToken"
              @focusout="listBoards">
          </div>
          <div class="col-sm-12 mb-2">
            <label for="board" class="form-label">Board</label>
            <select class="form-select form-select-lg" id="board" aria-label=".form-select-lg"
              v-model="data.selectedBoard" @change="listStages">
              <option v-for="board of data.boards" :value="board" :key="board.id">{{ board.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div class="card mb-4">
      <div class="card-header">
        <font-awesome-icon icon="robot" />
        Automações
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-sm-12 mb-2">
            <select class="form-select" aria-label=".form-select" v-model="data.selectedActionId">
              <option disabled selected :value="''">Selecione a ação</option>
              <option v-for="action of actions" :value="action.id" :key="action.id">
                {{ action.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Move tasks -->
        <div class="row" v-if="data.selectedActionId === 'move'">
          <div class="col-sm mb-2">
            <label for="sourceStage" class="form-label">Origem</label>
            <select class="form-select" aria-label=".form-select" id="sourceStage" v-model="data.selectedSourceStage">
              <option v-for="stage of data.stages" :value="stage.id" :key="stage.id">{{ stage.name }}</option>
            </select>
          </div>
          <div class="col-sm mb-2">
            <label for="sourceStage" class="form-label">Destino</label>
            <select class="form-select" aria-label=".form-select" id="sourceStage"
              v-model="data.selectedDestinationStage">
              <option v-for="stage of data.stages" :value="stage.id" :key="stage.id">{{ stage.name }}</option>
            </select>
          </div>
          <div class="col-sm-12 mb-2">
            <label for="condition" class="form-label">Condição</label>
            <select class="form-select" aria-label=".form-select" id="condition" v-model="data.selectedConditionId">
              <option disabled selected :value="''">Selecione a condição</option>
              <option v-for="condition of conditions" :value="condition.id" :key="condition.id">{{ condition.label }}
              </option>
            </select>
          </div>
          <div class="col-sm-6 d-grid mt-2">
            <button class="btn btn-secondary" :disabled="data.loading || data.selectedConditionId == ''"
              @click="listTasks">Preview</button>
          </div>
          <div class="col-sm-6 d-grid mt-2">
            <button class="btn btn-primary" :disabled="data.loading || !data.previewed || data.tasks.length === 0"
              @click="moveTasks"><b>Mover</b> as tasks abaixo</button>
          </div>
          <div class="d-grid mt-3" v-if="data.previewed">
            <table class="table table-striped">
              <thead class="table-secondary">
                <tr v-if="data.loading">
                  <th scope="col" colspan="5">Carregando...</th>
                </tr>
                <tr v-else>
                  <th scope="col">Código</th>
                  <th scope="col">Título</th>
                  <th scope="col">Entrega Desejada</th>
                  <th scope="col">De</th>
                  <th scope="col">Para</th>
                </tr>
              </thead>
              <tbody v-if="!data.loading">
                <tr v-for="task of data.tasks" :key="task.id">
                  <td>{{ task.id }}</td>
                  <td>{{ task.title }}</td>
                  <td>{{ task.desired_date }}</td>
                  <td>{{ task.stage }}</td>
                  <td>{{ data.stages.find((s) => s.id === data.selectedDestinationStage)?.name }}</td>
                </tr>
              </tbody>
              <tfoot class="table-secondary">
                <tr v-if="!data.loading">
                  <td colspan="5">Total: {{ data.tasks.length }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Update tasks -->
        <div class="row" v-if="data.selectedActionId === 'update'">
          <div class="col-sm mb-2">
            <label for="sourceStage" class="form-label">Coluna</label>
            <select class="form-select" aria-label=".form-select" id="sourceStage" v-model="data.selectedSourceStage">
              <option v-for="stage of data.stages" :value="stage.id" :key="stage.id">{{ stage.name }}</option>
            </select>
          </div>
          <div class="col-sm-12 mb-2">
            <label for="updateCondition" class="form-label">Condição para atualizar</label>
            <select style="white-space: normal;" class="form-select" aria-label=".form-select" id="updateCondition"
              v-model="data.selectedUpdateConditionId"
              :title="updateConditions.find((c) => c.id === data.selectedUpdateConditionId)?.tooltip">
              <option disabled selected :value="''">Selecione a condição</option>
              <option v-for="condition of updateConditions" :value="condition.id" :key="condition.id">
                {{ condition.label }}
              </option>
            </select>
          </div>
          <div class="col-sm-6 d-grid mt-2">
            <button class="btn btn-secondary" :disabled="data.loading || data.selectedUpdateConditionId == ''"
              @click="listTasks">Preview</button>
          </div>
          <div class="col-sm-6 d-grid mt-2">
            <button class="btn btn-primary" :disabled="data.loading || !data.previewed || data.tasks.length === 0"
              @click="updateTasks"><b>Alterar</b> as tasks abaixo</button>
          </div>
          <div class="d-grid mt-3" v-if="data.previewed">
            <table class="table table-striped">
              <thead class="table-secondary">
                <tr v-if="data.loading">
                  <th scope="col" colspan="6">Carregando...</th>
                </tr>
                <tr v-else>
                  <th scope="col">Código</th>
                  <th scope="col">Título</th>
                  <th scope="col">Coluna</th>
                  <th scope="col">Data de início</th>
                  <th scope="col">Entrega atual</th>
                  <th scope="col">Entrega após atualizar</th>
                </tr>
              </thead>
              <tbody v-if="!data.loading">
                <tr v-for="task of data.tasks" :key="task.id">
                  <td>{{ task.id }}</td>
                  <td>{{ task.title }}</td>
                  <td>{{ task.stage }}</td>
                  <td>{{ task.desired_start_date }}</td>
                  <td>{{ task.desired_date }}</td>
                  <td>{{ defineHour(task.desired_start_date!, 19) }}</td>
                </tr>
              </tbody>
              <tfoot class="table-secondary">
                <tr v-if="!data.loading">
                  <td colspan="6">Total: {{ data.tasks.length }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
