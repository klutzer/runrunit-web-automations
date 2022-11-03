<script setup lang="ts">
import { onMounted, reactive, watch } from "vue";
import { Runrunit, type Board, type Stage } from "@/runrunit";

let runrunit: Runrunit;

const authData = reactive({
  appToken: "",
  userToken: "",
});

const data = reactive({
  boards: [] as Board[],
  selectedBoard: {} as Board,
  stages: [] as Stage[],
  selectedStage: {} as Stage,
});

const listBoards = async () => {
  runrunit = new Runrunit(authData.appToken, authData.userToken);
  data.boards = await runrunit.listBoards();
  data.selectedBoard = data.boards[0];
  await listStages();
};

const listStages = async () => {
  data.stages = await runrunit.listStages(data.selectedBoard.id);
  data.selectedStage = data.stages[0];
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
            <select class="form-select form-select-lg" aria-label=".form-select-lg" v-model="data.selectedBoard"
              @change="listStages">
              <option v-for="board of data.boards" :value="board" :key="board.id">{{ board.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <font-awesome-icon icon="robot" />
        Automações
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-sm mb-2">
            <select class="form-select mb-2" aria-label=".form-select-lg" v-model="data.selectedStage">
              <option v-for="stage of data.stages" :value="stage" :key="stage.id">{{ stage.name }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
